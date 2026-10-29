export function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-15 bg-accent-blue/30"
        style={{ top: '-20%', left: '50%', transform: 'translateX(-50%)', animation: 'float 25s ease-in-out infinite' }}
      />
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-10 bg-accent-purple/30"
        style={{ top: '10%', right: '-10%', animation: 'float 30s ease-in-out infinite reverse', animationDelay: '-5s' }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-10 bg-accent-cyan/20"
        style={{ bottom: '-10%', left: '-5%', animation: 'float 20s ease-in-out infinite', animationDelay: '-10s' }}
      />
    </div>
  );
}
