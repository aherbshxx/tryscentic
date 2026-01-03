export default function Posters() {
  return (
    <section className="py-6 bg-gradient-to-b from-secondary/40 to-transparent">
      <div className="min-h-100 p-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div
          className="relative bg-cover bg-center text-center content-center"
          style={{
            backgroundImage: `url('/assets/images/category-1.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-gray-800 opacity-30 z-10"></div>
          <span className="relative z-10 text-5xl">All Fragrance Samples</span>
        </div>
        <div
          className="relative bg-cover bg-center text-center content-center"
          style={{
            backgroundImage: `url('/assets/images/category-2.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-gray-800 opacity-30 z-10"></div>
          <span className="relative z-10 text-5xl">Retail Bottoles</span>
        </div>
      </div>
    </section>
  );
}
