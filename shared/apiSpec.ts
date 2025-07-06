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
          reason: "FILE_TOO_LARGE" | "INTERNAL_ERROR";
        };
  };
  createOrder: {
    req: {
      order: Order;
    };
    res:
      | {
          ok: true;
          orderId: string;
        }
      | {
          ok: false;
          reason: "INVALID_ARTWORK";
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
        sideProcessing: {
          type: "stretch" | "repeat" | "solid_color" | "clip" | "flip" | "none" | "color";
          color?: string;
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
          reason: "INTERNAL_ERROR";
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
          reason: "INTERNAL_ERROR";
        };
  };
  updateArtwork: {
    req: {
      artworkId: string;
      title?: string;
      artwork?: {
        originalImageId: string;
        imageCenterXy: { x: number; y: number };
        sideProcessing: {
          type: "stretch" | "repeat" | "solid_color" | "clip" | "flip" | "none" | "color";
          color?: string;
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
          reason: "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED" | "INTERNAL_ERROR";
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
          reason: "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED" | "INTERNAL_ERROR";
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
          reason: "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED" | "INTERNAL_ERROR";
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
};
