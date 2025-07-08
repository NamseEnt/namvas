export type SchedulerMessageSpec = {
  verifyPayments: {};
  cancelOrders: {};
};

export const schedulerHandlers: SchedulerHandlers = {
  verifyPayments: async (params) =>
    (await import("./scheduler-handlers/verifyPayments")).verifyPayments(
      params
    ),
  cancelOrders: async (params) =>
    (await import("./scheduler-handlers/cancelOrders")).cancelOrders(params),
};

export type SchedulerHandlers = {
  [K in keyof SchedulerMessageSpec]: (
    params: SchedulerMessageSpec[K]
  ) => Promise<void>;
};
