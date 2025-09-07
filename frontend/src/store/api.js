import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:5000/api",
        prepareHeaders: (headers, { getState }) => {
            const state = getState() as RootState; // ✅ fixes 'unknown' error
            const token = state.auth.token;

            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        login: builder.mutation<
            { token: string }, // response type
            { adminUsername: string; adminPassword: string } // request body
        >({
            query: (body) => ({
                url: "/company/login",
                method: "POST",
                body,
            }),
        }),
        getProfile: builder.query<any, void>({
            query: () => "/company/profile",
        }),
    }),
});

export const { useLoginMutation, useGetProfileQuery } = api;
