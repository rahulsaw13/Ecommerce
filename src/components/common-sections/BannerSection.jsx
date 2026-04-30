const BannerSection = ({ image, alt = "Banner", className = "" }) => {
  // Don't render if no image is provided
  if (!image) {
    return null;
  }

  return (
    <section className={`mb-6 ${className}`}>
      <div className="relative w-full h-52 rounded-xl overflow-hidden shadow-lg">
        <img 
          src={image} 
          alt={alt} 
          className="w-full h-full object-cover"
        />
      </div>
    </section>
  );
};

export default BannerSection;
