const StatsSection = () => {
  const stats = [
    { value: "25+", label: "Years Experience" },
    { value: "40+", label: "Countries Served" },
    { value: "200+", label: "Product Lines" },
    { value: "ISO", label: "Certified Quality" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-4xl font-bold mb-2 ${
                index === 0 ? 'primary-blue' :
                index === 1 ? 'primary-green' :
                index === 2 ? 'accent-orange' : 'primary-blue'
              }`}>
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
