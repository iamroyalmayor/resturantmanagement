import { appConfig } from '../config/app';

type MockResponse<T> = { data: T; status: number };

function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function mockGet<T>(endpoint: string): Promise<MockResponse<T>> {
  if (!appConfig.enableMockData) {
    throw new Error('Mock data is disabled. Configure VITE_ENABLE_MOCK_DATA=true');
  }
  await delay();
  const data = resolveMockEndpoint(endpoint);
  return { data: data as T, status: 200 };
}

export async function mockPost<T>(endpoint: string, body: any): Promise<MockResponse<T>> {
  if (!appConfig.enableMockData) {
    throw new Error('Mock data is disabled');
  }
  await delay(200);
  return { data: body as T, status: 201 };
}

export async function mockPut<T>(endpoint: string, body: any): Promise<MockResponse<T>> {
  if (!appConfig.enableMockData) {
    throw new Error('Mock data is disabled');
  }
  await delay(200);
  return { data: body as T, status: 200 };
}

export async function mockDelete(endpoint: string): Promise<MockResponse<null>> {
  if (!appConfig.enableMockData) {
    throw new Error('Mock data is disabled');
  }
  await delay(150);
  return { data: null, status: 204 };
}

function resolveMockEndpoint(endpoint: string): unknown {
  const routes: Record<string, unknown> = {
    '/dashboard/stats': {
      todayRevenue: 2847,
      todayOrders: 47,
      activeReservations: 23,
      lowStockItems: 5,
      staffOnDuty: 12,
      averageOrderValue: 38.50,
      customerSatisfaction: 4.8,
      tableOccupancy: 78,
    },
  };
  return routes[endpoint] || null;
}
