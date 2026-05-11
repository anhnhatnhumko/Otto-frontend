import ServiceCard from "@/components/ServiceCard";

const services = [
  { id: 1, name: "Dọn nhà", icon: "🧹" },
  { id: 2, name: "Giặt ủi", icon: "🧺" },
  { id: 3, name: "Sửa điện nước", icon: "🔧" },
  { id: 4, name: "Vệ sinh máy lạnh", icon: "❄️" },
];

export default function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bạn cần dịch vụ gì?</h1>

      <div className="grid grid-cols-2 gap-4">
        {services.map((s) => (
          <ServiceCard
            key={s.id}
            icon={s.icon}
            title={s.name}
          />
        ))}
      </div>
    </main>
  );
}
