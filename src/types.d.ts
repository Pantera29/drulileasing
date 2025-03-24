import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
}

// Tipo para datos de usuario
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

// Tipo para respuestas de API
export interface ApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
  status: number;
}

// Otros tipos que podrían ser necesarios
export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
} 