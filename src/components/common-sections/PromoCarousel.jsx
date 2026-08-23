const PromoCarousel = ({ images }) => {
  const promos = images?.length > 0
    ? images.map((img, i) => ({ id: img.id ?? i, image: img.url || img.image_url }))
    : [];

  if (promos.length === 0) return null;

  return (
    <div
      className="flex gap-3 mb-4 overflow-x-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {promos.map((promo, i) => (
        <img
          key={promo.id}
          src={promo.image}
          alt={`Banner ${i + 1}`}
          className="rounded-2xl flex-shrink-0 object-contain"
          style={{ height: 'clamp(160px, 22vw, 260px)', width: 'auto', maxWidth: '85vw' }}
          loading={i === 0 ? 'eager' : 'lazy'}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ))}
    </div>
  );
};

export default PromoCarousel;
