import type { Artwork, Order, SideMode } from "./types";

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
  logout: {
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
          reason: "GOOGLE_API_ERROR";
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
          reason: "TWITTER_API_ERROR";
        };
  };
  getArtworkImagePutUrl: {
    req: {
      artworkId: string;
      contentLength: number;
    };
    res:
      | {
          ok: true;
          uploadUrl: string;
        }
      | {
          ok: false;
          reason: "FILE_TOO_LARGE" | "NOT_LOGGED_IN";
        };
  };
  createOrder: {
    req: {
      rows: Array<{
        item:
          | {
              type: "artwork";
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
            }
          | {
              type: "plasticStand";
            };
        count: number;
        price: number;
      }>;
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
          reason:
            | "NOT_LOGGED_IN"
            | "EMPTY_ORDER_ITEMS"
            | "INVALID_ITEM_TYPE"
            | "INVALID_COUNT"
            | "INVALID_PRICE";
        };
  };
  listMyOrders: {
    req: {
      nextToken?: string;
      pageSize: number;
    };
    res:
      | {
          ok: true;
          orders: Order[];
          nextToken?: string;
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
          reason:
            | "NOT_LOGGED_IN"
            | "ORDER_NOT_FOUND"
            | "TOO_LATE_TO_CANCEL"
            | "PERMISION_DENIED";
        };
  };
  newArtwork: {
    req: {
      title: string;
      sideMode: SideMode;
      imageOffset: { x: number; y: number };
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
  updateArtwork: {
    req: {
      artworkId: string;
      title: string;
      sideMode: SideMode;
      imageOffset: { x: number; y: number };
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason: "NOT_LOGGED_IN" | "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED";
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
          reason: "NOT_LOGGED_IN" | "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED";
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
          reason: "NOT_LOGGED_IN" | "ARTWORK_NOT_FOUND" | "PERMISSION_DENIED";
        };
  };
  listMyArtworks: {
    req: {
      nextToken?: string;
      pageSize: number;
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
  getPsdToJpgConvertPutUrl: {
    req: {
      contentLength: number;
    };
    res:
      | {
          ok: true;
          uploadUrl: string;
          conversionId: string;
        }
      | {
          ok: false;
          reason: "FILE_TOO_LARGE";
        };
  };
  convertPsdToJpg: {
    req: {
      conversionId: string;
    };
    res:
      | {
          ok: true;
        }
      | {
          ok: false;
          reason:
            | "CONVERSION_NOT_FOUND"
            | "CONVERSION_FAILED"
            | "INTERNAL_ERROR";
        };
  };
};
