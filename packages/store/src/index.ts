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
import { organizerEventsApi } from "./reducers/organizerEventsApi"
import { legalApi } from "./reducers/legalApi"
import { dataRetentionApi } from "./reducers/dataRetentionApi"
import { ticketingApi } from "./reducers/ticketingApi"
import { eventScheduleApi } from "./reducers/eventScheduleApi"
import { registrationApi } from "./reducers/registrationApi"
import { financeApi } from "./reducers/financeApi"
import { refundsApi } from "./reducers/refundsApi"
import { commercialApi } from "./reducers/commercialApi"
import { systemApi } from "./reducers/systemApi"
import { notificationsApi } from "./reducers/notificationsApi"
import { adminMessagingApi } from "./reducers/adminMessagingApi"
import { adminMarketplaceApi } from "./reducers/adminMarketplaceApi"
import { attendeesApi } from "./reducers/attendeesApi"
import { messagingApi } from "./reducers/messagingApi"

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
    [organizerEventsApi.reducerPath]: organizerEventsApi.reducer,
    [legalApi.reducerPath]: legalApi.reducer,
    [dataRetentionApi.reducerPath]: dataRetentionApi.reducer,
    [ticketingApi.reducerPath]: ticketingApi.reducer,
    [eventScheduleApi.reducerPath]: eventScheduleApi.reducer,
    [registrationApi.reducerPath]: registrationApi.reducer,
    [financeApi.reducerPath]: financeApi.reducer,
    [refundsApi.reducerPath]: refundsApi.reducer,
    [commercialApi.reducerPath]: commercialApi.reducer,
    [systemApi.reducerPath]: systemApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [adminMessagingApi.reducerPath]: adminMessagingApi.reducer,
    [adminMarketplaceApi.reducerPath]: adminMarketplaceApi.reducer,
    [attendeesApi.reducerPath]: attendeesApi.reducer,
    [messagingApi.reducerPath]: messagingApi.reducer,
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
      organizerEventsApi.middleware,
      legalApi.middleware,
      dataRetentionApi.middleware,
      ticketingApi.middleware,
      eventScheduleApi.middleware,
      registrationApi.middleware,
      financeApi.middleware,
      refundsApi.middleware,
      commercialApi.middleware,
      systemApi.middleware,
      notificationsApi.middleware,
      adminMessagingApi.middleware,
      adminMarketplaceApi.middleware,
      attendeesApi.middleware,
      messagingApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export * from "./api"
export * from "./reducers/messagingApi"
export * from "./reducers/commercialApi"
export * from "./reducers/notificationsApi"
