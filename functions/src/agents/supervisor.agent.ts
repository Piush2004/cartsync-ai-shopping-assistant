import { memoryAgent } from './memory.agent';
import { profileAgent } from './profile.agent';
import { catalogAgent } from './catalog.agent';
import { stylingAgent } from './styling.agent';
import { avatarAgent } from './avatar.agent';
import { vtonAgent } from './vton.agent';
import { recommendationAgent } from './recommendation.agent';

export class SupervisorAgent {
  /**
   * Orchestrates incoming user requests.
   * Decides which specialized agents to load and delegates tasks accordingly.
   */
  async handleUserQuery(uid: string, sessionId: string, prompt: string): Promise<any> {
    console.log(`[SupervisorAgent] Dispatching query for user ${uid} in session ${sessionId}`);
    
    // 1. Record incoming user message
    await memoryAgent.recordMessage(sessionId, uid, 'user', prompt);
    
    // 2. Fetch context
    const preferences = await profileAgent.getStylingPreferences(uid);
    const measurements = await profileAgent.getMeasurementProfile(uid);
    
    const lowerPrompt = prompt.toLowerCase();
    
    try {
      // Intent A: Virtual Try-On
      if (lowerPrompt.includes('try on') || lowerPrompt.includes('tryon') || lowerPrompt.includes('wear')) {
        const currentAvatarId = preferences?.currentAvatarId;
        if (!currentAvatarId) {
          const reply = "I need a 3D avatar of yours before generating a try-on. Would you like me to create one first?";
          await memoryAgent.recordMessage(sessionId, uid, 'assistant', reply);
          return { response: reply, actionRequired: 'CREATE_AVATAR' };
        }
        
        // Find matching item in catalog
        const garments = await catalogAgent.searchGarments(prompt, preferences);
        const garment = garments[0] || { name: "Zara Casual Shirt", category: "tops", imageUrl: "zara_shirt.jpg" };
        
        const avatarDoc = await require('../config/firebase').db.collection('avatars').doc(currentAvatarId).get();
        const avatarData = avatarDoc.exists ? avatarDoc.data() : null;
        const avatarUrl = avatarData?.shapeParameters ? "mock_avatar_mesh.obj" : "base_avatar.obj";
        
        const result = await vtonAgent.runTryOn(uid, avatarUrl, garment.imageUrl, garment.category);
        const reply = `I've generated a Virtual Try-On for the ${garment.name}! You can view the result here: ${result.outputUrl}`;
        
        await memoryAgent.recordMessage(sessionId, uid, 'assistant', reply);
        
        // Log activity timeline
        const { activityService } = require('../services/activity.service');
        await activityService.logEvent(uid, 'VTON Completed', { garmentName: garment.name, resultUrl: result.outputUrl });
        
        await memoryAgent.generateOrUpdateSummary(
          uid,
          `User try-on requested for ${garment.name}. Result URL: ${result.outputUrl}`,
          preferences?.favoriteBrands || [],
          'Completed try-on.'
        );

        return { response: reply, result };
      }
      
      // Intent B: Create 3D Avatar
      if (lowerPrompt.includes('avatar') || lowerPrompt.includes('3d model') || lowerPrompt.includes('mesh')) {
        if (!measurements) {
          const reply = "Please run body measurements first so we have the physical parameters needed to construct your SMPL avatar.";
          await memoryAgent.recordMessage(sessionId, uid, 'assistant', reply);
          return { response: reply, actionRequired: 'MEASUREMENT_REQUIRED' };
        }
        
        const result = await avatarAgent.generateAvatar(uid);
        const reply = "Your 3D body avatar was successfully generated and registered. You can now try on catalog garments!";
        
        await memoryAgent.recordMessage(sessionId, uid, 'assistant', reply);
        
        // Log activity timeline
        const { activityService } = require('../services/activity.service');
        await activityService.logEvent(uid, 'Avatar Generated', { avatarId: result.avatarId });

        await memoryAgent.generateOrUpdateSummary(
          uid,
          `Avatar generated successfully. Avatar ID: ${result.avatarId}`,
          preferences?.favoriteBrands || [],
          'Constructed 3D SMPL mesh.'
        );

        return { response: reply, result };
      }
      
      // Intent C: Catalog search & recommendations
      if (lowerPrompt.includes('find') || lowerPrompt.includes('search') || lowerPrompt.includes('buy') || lowerPrompt.includes('shop')) {
        const garments = await catalogAgent.searchGarments(prompt, preferences);
        if (garments.length === 0) {
          const reply = "I couldn't find any items matching that query in our catalog. Do you have another style in mind?";
          await memoryAgent.recordMessage(sessionId, uid, 'assistant', reply);
          return { response: reply };
        }
        
        // Run size recommendation for the first matching item if profile exists
        let sizeRecommendation = "";
        if (measurements) {
          const sizeChart = {
            "S": { chest: [84, 92], waist: [70, 78], hips: [84, 92] },
            "M": { chest: [92, 100], waist: [78, 86], hips: [92, 100] },
            "L": { chest: [100, 108], waist: [86, 94], hips: [100, 108] },
            "XL": { chest: [108, 116], waist: [94, 102], hips: [108, 116] }
          };
          const sizing = await recommendationAgent.recommend(
            { chest: measurements.chest, waist: measurements.waist, hips: measurements.hips },
            sizeChart
          );
          sizeRecommendation = ` (Best fit for you: Size ${sizing.recommendedSize} - ${sizing.fitType} fit)`;
        }
        
        const itemsText = garments.map(g => `- **${g.brand}** ${g.name} ($${g.price})${sizeRecommendation}`).join("\n");
        const reply = `I found these options in the catalog:\n\n${itemsText}\n\nWould you like to try any of these on?`;
        
        await memoryAgent.recordMessage(sessionId, uid, 'assistant', reply);
        return { response: reply, garments };
      }
      
      // Intent D: Default Conversational styling advice
      const advice = await stylingAgent.generateStylingAdvice(uid, sessionId, prompt);
      
      // Log activity timeline and update summary
      const { activityService } = require('../services/activity.service');
      await activityService.logEvent(uid, 'Style Profile Updated', { query: prompt });
      await memoryAgent.generateOrUpdateSummary(
        uid,
        `User styling query: "${prompt.substring(0, 40)}...". Stylist advice: "${advice.substring(0, 40)}..."`,
        preferences?.favoriteBrands || [],
        'Updated stylist consultation notes.'
      );

      return { response: advice };
      
    } catch (e: any) {
      console.error("[SupervisorAgent] Pipeline error:", e);
      const reply = "I encountered an error while coordinating your request. Let's try again in a moment!";
      await memoryAgent.recordMessage(sessionId, uid, 'assistant', reply);
      return { response: reply, error: e.message };
    }
  }
}

export const supervisorAgent = new SupervisorAgent();
