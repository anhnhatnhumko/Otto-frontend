export default function AuthSideImage() {
  return (
    <div className="hidden lg:block relative">
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      {/* Image */}
      <img
        src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136"
        alt="Otto services"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary)/0.8)] to-[hsl(var(--primary)/0.2)]"
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-end p-12 text-white">
        <div>
          <h2 className="text-3xl font-bold mb-4">
            Cuộc sống tiện lợi hơn với Otto
          </h2>
          <p className="text-white/80 text-lg">
            Hơn 50,000 khách hàng đã tin tưởng sử dụng dịch vụ của chúng tôi
          </p>
        </div>
      </div>
    </div>
  );
}
