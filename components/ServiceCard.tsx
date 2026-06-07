"use client";

import { useRouter } from "next/navigation";
import {
  Home,
  Shirt,
  Wrench,
  Heart,
  Sparkles,
  Car,
} from "lucide-react";

type ServiceCardProps = {
  icon: string;
  title: string;
  description?: string;
  price?: string;
  popular?: boolean;
  serviceId?: string;
};

const iconMap: Record<string, any> = {
  home: Home,
  shirt: Shirt,
  wrench: Wrench,
  heart: Heart,
  sparkles: Sparkles,
  car: Car,
};

export default function ServiceCard(props: ServiceCardProps) {
  const router = useRouter();
  const Icon = iconMap[props.icon];

  const handleClick = () => {
    if (props.serviceId) {
      router.push(`/book-service?serviceId=${props.serviceId}`);
    } else {
      router.push("/book-service");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer rounded-xl bg-card p-6 shadow-card hover:shadow-card-hover transition"
    >
      {/* Icon */}
      <div className="mb-4 flex items-center justify-center">
        {Icon && <Icon className="h-9 w-9 text-primary" />}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-lg mb-1 text-center">
        {props.title}
      </h3>

      {/* Description */}
      {props.description && (
        <p className="text-sm text-muted-foreground text-center mb-3">
          {props.description}
        </p>
      )}

      {/* Price */}
      {props.price && (
        <p className="text-primary font-medium text-center">
          {props.price}
        </p>
      )}

      {/* Popular badge (nếu có) */}
      {props.popular && (
        <span className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Phổ biến
        </span>
      )}
    </div>
  );
}
