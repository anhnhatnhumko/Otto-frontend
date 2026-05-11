type AddressParts = {
  addressDetail?: string;
  wardName?: string;
  provinceName?: string;
};

export function buildFullAddress({ addressDetail, wardName, provinceName }: AddressParts) {
  return [addressDetail, wardName, provinceName]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}
