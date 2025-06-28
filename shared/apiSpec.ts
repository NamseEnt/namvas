export type ApiSpec = {
  getMe: {
    req: {};
    res:
      | {
          ok: true;
          tosAgreed: boolean;
        }
      | {
          ok: false;
          reason: "NOT_LOGGED_IN";
        };
  };
  loginWithGoogle: {
    req: {
      authorizationCode: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "INVALID_CODE" | "GOOGLE_API_ERROR";
        };
  };
  loginWithTwitter: {
    req: {
      authorizationCode: string;
      codeVerifier: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "INVALID_CODE" | "TWITTER_API_ERROR";
        };
  };
  getTextureUploadUrl: {
    req: {
      fileName: string;
      contentType: string;
    };
    res:
      | {
          ok: true;
          uploadUrl: string;
          fileUrl: string; // S3 object URL after upload
        }
      | {
          ok: false;
          reason: "INVALID_FILE_TYPE" | "INTERNAL_ERROR";
        };
  };
  createOrder: {
    req: {
      artworkDefinition: {
        originalImageDataUrl: string;
        mmPerPixel: number;
        imageCenterXy: { x: number; y: number };
        sideProcessing: {
          type: "clip" | "color" | "flip" | "none";
          color?: string;
        };
        canvasBackgroundColor: string;
      };
      textureUrl: string; // S3 URL from texture upload
      quantity: number;
      hasPlasticStand: boolean;
      recipient: {
        name: string;
        phone: string;
        postalCode: string;
        address: string;
        addressDetail: string;
      };
      deliveryMemo?: string;
    };
    res:
      | {
          ok: true;
          orderId: string;
          orderNumber: string;
          totalAmount: number;
        }
      | {
          ok: false;
          reason: "INVALID_ARTWORK" | "INVALID_TEXTURE_URL" | "INTERNAL_ERROR";
        };
  };
  getOrders: {
    req: {};
    res:
      | {
          ok: true;
          orders: Array<{
            id: string;
            orderDate: string;
            orderNumber: string;
            thumbnailUrl: string;
            finalAmount: number;
            status: "payment_completed" | "in_production" | "shipping" | "delivered";
            quantity: number;
            hasPlasticStand: boolean;
          }>;
        }
      | {
          ok: false;
          reason: "NOT_LOGGED_IN";
        };
  };
  cancelOrder: {
    req: {
      orderId: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "ORDER_NOT_FOUND" | "CANNOT_CANCEL" | "NOT_AUTHORIZED";
        };
  };
  // Admin APIs
  adminLogin: {
    req: {
      email: string;
      password: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "INVALID_CREDENTIALS";
        };
  };
  adminGetMe: {
    req: {};
    res:
      | {
          ok: true;
          isAdmin: true;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN";
        };
  };
  adminGetDashboard: {
    req: {};
    res:
      | {
          ok: true;
          pendingTasks: Array<{
            id: string;
            type: "payment_completed" | "production_hold";
            orderNumber: string;
            customerName: string;
            amount: number;
            createdAt: string;
          }>;
          todayStats: {
            orders: number;
            revenue: number;
            newUsers: number;
          };
        }
      | {
          ok: false;
          reason: "NOT_ADMIN";
        };
  };
  adminGetOrders: {
    req: {
      status?: "payment_completed" | "in_production" | "shipping" | "delivered" | "production_hold";
      search?: string;
      page?: number;
      limit?: number;
    };
    res:
      | {
          ok: true;
          orders: Array<{
            id: string;
            orderNumber: string;
            customerName: string;
            customerEmail: string;
            orderDate: string;
            finalAmount: number;
            status: "payment_completed" | "in_production" | "shipping" | "delivered" | "production_hold";
            quantity: number;
            hasPlasticStand: boolean;
            thumbnailUrl: string;
            trackingNumber?: string;
            adminMemo?: string;
          }>;
          total: number;
          page: number;
          totalPages: number;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN";
        };
  };
  adminGetOrderDetail: {
    req: {
      orderId: string;
    };
    res:
      | {
          ok: true;
          order: {
            id: string;
            orderNumber: string;
            orderDate: string;
            finalAmount: number;
            status: "payment_completed" | "in_production" | "shipping" | "delivered" | "production_hold";
            quantity: number;
            hasPlasticStand: boolean;
            customer: {
              name: string;
              email: string;
              phone: string;
            };
            recipient: {
              name: string;
              phone: string;
              postalCode: string;
              address: string;
              addressDetail: string;
            };
            deliveryMemo?: string;
            artworkDefinition: {
              originalImageDataUrl: string;
              mmPerPixel: number;
              imageCenterXy: { x: number; y: number };
              sideProcessing: {
                type: "clip" | "color" | "flip" | "none";
                color?: string;
              };
              canvasBackgroundColor: string;
            };
            textureUrl: string;
            printImageUrl: string; // 300DPI print-ready image
            trackingNumber?: string;
            adminMemo?: string;
          };
        }
      | {
          ok: false;
          reason: "NOT_ADMIN" | "ORDER_NOT_FOUND";
        };
  };
  adminUpdateOrderStatus: {
    req: {
      orderId: string;
      status: "payment_completed" | "in_production" | "shipping" | "delivered" | "production_hold";
      trackingNumber?: string;
      adminMemo?: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN" | "ORDER_NOT_FOUND" | "INVALID_STATUS";
        };
  };
  adminGetUsers: {
    req: {
      search?: string;
      page?: number;
      limit?: number;
    };
    res:
      | {
          ok: true;
          users: Array<{
            id: string;
            name: string;
            email: string;
            provider: "google" | "twitter";
            joinDate: string;
            orderCount: number;
            totalSpent: number;
            lastOrderDate?: string;
          }>;
          total: number;
          page: number;
          totalPages: number;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN";
        };
  };
  adminGetUserDetail: {
    req: {
      userId: string;
    };
    res:
      | {
          ok: true;
          user: {
            id: string;
            name: string;
            email: string;
            provider: "google" | "twitter";
            joinDate: string;
            orders: Array<{
              id: string;
              orderNumber: string;
              orderDate: string;
              finalAmount: number;
              status: "payment_completed" | "in_production" | "shipping" | "delivered" | "production_hold";
              quantity: number;
            }>;
            totalSpent: number;
            orderCount: number;
          };
        }
      | {
          ok: false;
          reason: "NOT_ADMIN" | "USER_NOT_FOUND";
        };
  };
  adminGetSiteSettings: {
    req: {};
    res:
      | {
          ok: true;
          settings: {
            announcements: Array<{
              id: string;
              message: string;
              type: "urgent" | "normal";
              isActive: boolean;
              createdAt: string;
            }>;
            pricing: {
              basePrice: number;
              plasticStandPrice: number;
              shippingFee: number;
            };
          };
        }
      | {
          ok: false;
          reason: "NOT_ADMIN";
        };
  };
  adminUpdateSiteSettings: {
    req: {
      announcements?: Array<{
        id?: string;
        message: string;
        type: "urgent" | "normal";
        isActive: boolean;
      }>;
      pricing?: {
        basePrice?: number;
        plasticStandPrice?: number;
        shippingFee?: number;
      };
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN" | "INVALID_SETTINGS";
        };
  };
};
