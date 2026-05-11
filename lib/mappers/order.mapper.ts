export const mapOrder = (data: any) => {
  function formatDateTimeRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const datePart = startDate.toLocaleDateString("vi-VN");

    const startTime = startDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const endTime = endDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      date: datePart,
      time: `${startTime} - ${endTime}`,
    };
  }

  return {
    _id: data._id?.toString(),

    status: data.status,

    paymentStatus: data.paymentStatus || "",

    isPaid: Boolean(data.isPaid),

    service: data.serviceSnapshot?.name || "—",

    // 🔥 RANGE TIME
    ...formatDateTimeRange(data.startTime, data.endTime),

    address: data.address || data.addressDetail || "",

    price: data.totalPrice || 0,

    rating: data.rating || 0,

    review: data.review || "",

    tasker: data.tasker
      ? {
          name: data.tasker.name,
          avatar: data.tasker.avatar,
          rating: data.tasker.rating || 0,
          completedJobs: data.tasker.completedJobs || 0,
          phone: data.tasker.phone,
        }
      : undefined,

    cancelReason: data.cancelReason,
  };
};