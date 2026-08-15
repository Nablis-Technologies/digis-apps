import { configureStore } from "@reduxjs/toolkit"
import { authApi } from "./reducers/authApi"
import { usersApi } from "./reducers/usersApi"
import { rolesApi } from "./reducers/rolesApi"
import { permissionsApi } from "./reducers/permissionsApi"
import { categoriesApi } from "./reducers/categoriesApi"
import { venuesApi } from "./reducers/venuesApi"
import { artistsApi } from "./reducers/artistsApi"
import { organizationsApi } from "./reducers/organizationsApi"
import { membershipsApi } from "./reducers/membershipsApi"
import { eventsApi } from "./reducers/eventsApi"
import { legalApi } from "./reducers/legalApi"
import { dataRetentionApi } from "./reducers/dataRetentionApi"
import { ticketingApi } from "./reducers/ticketingApi"
import { eventScheduleApi } from "./reducers/eventScheduleApi"
import { registrationApi } from "./reducers/registrationApi"

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
    [permissionsApi.reducerPath]: permissionsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [venuesApi.reducerPath]: venuesApi.reducer,
    [artistsApi.reducerPath]: artistsApi.reducer,
    [organizationsApi.reducerPath]: organizationsApi.reducer,
    [membershipsApi.reducerPath]: membershipsApi.reducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [legalApi.reducerPath]: legalApi.reducer,
    [dataRetentionApi.reducerPath]: dataRetentionApi.reducer,
    [ticketingApi.reducerPath]: ticketingApi.reducer,
    [eventScheduleApi.reducerPath]: eventScheduleApi.reducer,
    [registrationApi.reducerPath]: registrationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      usersApi.middleware,
      rolesApi.middleware,
      permissionsApi.middleware,
      categoriesApi.middleware,
      venuesApi.middleware,
      artistsApi.middleware,
      organizationsApi.middleware,
      membershipsApi.middleware,
      eventsApi.middleware,
      legalApi.middleware,
      dataRetentionApi.middleware,
      ticketingApi.middleware,
      eventScheduleApi.middleware,
      registrationApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
