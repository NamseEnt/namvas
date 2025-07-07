import type { Artwork, Order, OrderStatus } from "./types";


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
  logOut: {
    req: {};
    res: {
      ok: true;
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
  getOriginalImageUploadUrl: {
    req: {
      contentLength: number;
    };
    res:
      | {
          ok: true;
          uploadUrl: string;
          imageId: string;
        }
      | {
          ok: false;
          reason: "FILE_TOO_LARGE" | "NOT_LOGGED_IN";
        };
  };
  createOrder: {
    req: {
      orderItems: Array<{
        artwork: {
          title: string;
          originalImageId: string;
          dpi: number;
          imageCenterXy: { x: number; y: number };
          sideProcessing:
            | {
                type: "clip" | "flip" | "none";
              }
            | {
                type: "color";
                color: string;
              };
        };
        quantity: number;
        price: number;
      }>;
      plasticStandCount: number;
      plasticStandPrice: number;
      totalPrice: number;
      naverPaymentId: string;
      recipient: {
        name: string;
        phone: string;
        postalCode: string;
        address: string;
        addressDetail: string;
        memo: string;
      };
    };
    res:
      | {
          ok: true;
          orderId: string;
        }
      | {
          ok: false;
          reason: "NOT_LOGGED_IN" | "EMPTY_ORDER_ITEMS" | "PRICE_MISMATCH";
        };
  };
  getMyOrders: {
    req: {};
    res:
      | {
          ok: true;
          orders: Order[];
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
          reason: "ORDER_NOT_FOUND" | "TOO_LATE_TO_CANCEL" | "PERMISION_DENIED";
        };
  };
  newArtwork: {
    req: {
      title: string;
      artwork: {
        originalImageId: string;
        imageCenterXy: { x: number; y: number };
        sideProcessing:
          | {
              type: "clip" | "flip" | "none";
            }
          | {
              type: "color";
              color: string;
            };
        canvasBackgroundColor: string;
      };
      thumbnailId: string;
    };
    res:
      | {
          ok: true;
          artworkId: string;
        }
      | {
          ok: false;
          reason: "NOT_LOGGED_IN";
        };
  };
  queryArtworksOfUser: {
    req: {};
    res:
      | {
          ok: true;
          artworks: Artwork[];
        }
      | {
          ok: false;
          reason: "NOT_LOGGED_IN";
        };
  };
  updateArtwork: {
    req: {
      artworkId: string;
      title?: string;
      artwork?: {
        originalImageId: string;
        imageCenterXy: { x: number; y: number };
        sideProcessing:
          | {
              type: "clip" | "flip" | "none";
            }
          | {
              type: "color";
              color: string;
            };
        canvasBackgroundColor: string;
      };
      thumbnailId?: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED";
        };
  };
  deleteArtwork: {
    req: {
      artworkId: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED";
        };
  };
  duplicateArtwork: {
    req: {
      artworkId: string;
      title: string;
    };
    res:
      | {
          ok: true;
          artworkId: string;
        }
      | {
          ok: false;
          reason: "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED";
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
            order: Order;
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
      status?: OrderStatus;
      search?: string;
      page?: number;
      limit?: number;
    };
    res:
      | {
          ok: true;
          orders: Order[];
          total: number;
          page: number;
          totalPages: number;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN";
        };
  };
  adminGetOrder: {
    req: {
      orderId: string;
    };
    res:
      | {
          ok: true;
          order: Order;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN" | "ORDER_NOT_FOUND";
        };
  };
  adminUpdateOrderStatus: {
    req: {
      orderId: string;
      status: OrderStatus;
      adminMemo: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN" | "ORDER_NOT_FOUND";
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
            joinedAt: string;
            orders: Order[];
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
  queryMyArtworks: {
    req: {
      nextToken?: string;
      pageSize?: number;
    };
    res:
      | {
          ok: true;
          artworks: ({ id: string } | Artwork)[];
          nextToken?: string;
        }
      | {
          ok: false;
          reason: "NOT_LOGGED_IN";
        };
  };
  adminGetFailedPayments: {
    req: {
      page?: number;
      limit?: number;
    };
    res:
      | {
          ok: true;
          orders: Order[];
          total: number;
          page: number;
          totalPages: number;
        }
      | {
          ok: false;
          reason: "NOT_ADMIN";
        };
  };
};
