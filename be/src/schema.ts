type Pk<T> = T;

export type Session = {
  id: Pk<string>;
  userId: string;
};

export type User = {
  id: Pk<string>;
  createdAt: string;
  tosAgreed: boolean;
};

export type Identity = {
  provider: Pk<string>;
  providerId: Pk<string>;
  userId: string;
};
