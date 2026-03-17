export default function FloatingDots() {
  return (
    <>
      <div className="pointer-events-none absolute top-20 left-10 h-3 w-3 rounded-full bg-supet-orange/40 animate-float" />
      <div className="pointer-events-none absolute top-40 right-20 h-2 w-2 rounded-full bg-supet-orange/30 animate-float-slow" />
      <div className="pointer-events-none absolute bottom-32 left-1/4 h-4 w-4 rounded-full bg-supet-orange/20 animate-float-slower" />
      <div className="pointer-events-none absolute top-1/3 right-1/3 h-2.5 w-2.5 rounded-full bg-supet-orange/25 animate-float" />
      <div className="pointer-events-none absolute bottom-20 right-10 h-3 w-3 rounded-full bg-supet-orange/35 animate-float-slow" />
    </>
  );
}
