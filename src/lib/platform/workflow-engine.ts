export class WorkflowEngine {
  /**
   * Dynamically orchestrates a sequence of steps.
   * e.g. [FraudCheck -> InventoryCheck -> Payment -> WebhookDispatch]
   */
  public async executeWorkflow(workflowName: string, context: any, steps: Function[]): Promise<any> {
    console.log(`[Workflow Engine] Starting workflow: ${workflowName}`);
    let currentContext = { ...context };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        currentContext = await step(currentContext);
      } catch (error) {
        console.error(`[Workflow Engine] Step ${i} failed in ${workflowName}`, error);
        throw error;
      }
    }

    return currentContext;
  }
}
