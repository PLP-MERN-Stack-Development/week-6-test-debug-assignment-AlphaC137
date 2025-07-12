// useApi.test.js - Unit tests for useApi custom hook

import { renderHook, act } from '@testing-library/react';
import { useApi } from '../../hooks/useApi';

// Mock fetch
global.fetch = jest.fn();

describe('useApi Hook', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useApi());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful API request', async () => {
    const mockData = { id: 1, name: 'Test' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request('/api/test');
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should handle API request with custom options', async () => {
    const mockData = { success: true };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useApi());

    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token123',
      },
      body: JSON.stringify({ name: 'test' }),
    };

    await act(async () => {
      await result.current.request('/api/create', options);
    });

    expect(fetch).toHaveBeenCalledWith('/api/create', {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123',
      },
    });
  });

  it('should set loading state during request', async () => {
    let resolvePromise;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    fetch.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.request('/api/test');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({ data: 'test' }),
      });
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('should handle HTTP error responses', async () => {
    const errorMessage = 'Not found';
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: errorMessage }),
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request('/api/not-found');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual({
      status: 404,
      statusText: 'Not Found',
      message: errorMessage,
    });
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    fetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request('/api/test');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual({
      message: 'Network error',
    });
  });

  it('should reset state when reset is called', async () => {
    const mockData = { id: 1, name: 'Test' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request('/api/test');
    });

    expect(result.current.data).toEqual(mockData);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle concurrent requests correctly', async () => {
    const mockData1 = { id: 1, name: 'Test1' };
    const mockData2 = { id: 2, name: 'Test2' };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
      });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      const promise1 = result.current.request('/api/test1');
      const promise2 = result.current.request('/api/test2');
      await Promise.all([promise1, promise2]);
    });

    // Should have the result of the last request
    expect(result.current.data).toEqual(mockData2);
  });

  it('should handle malformed JSON responses', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request('/api/test');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual({
      message: 'Invalid JSON',
    });
  });

  it('should handle empty response body', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request('/api/test');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should abort previous request when new request is made', async () => {
    const abortSpy = jest.fn();
    const mockAbortController = {
      abort: abortSpy,
      signal: { aborted: false },
    };

    // Mock AbortController
    global.AbortController = jest.fn(() => mockAbortController);

    let resolveFirst;
    const firstPromise = new Promise(resolve => {
      resolveFirst = resolve;
    });

    fetch.mockReturnValueOnce(firstPromise);

    const { result } = renderHook(() => useApi());

    // Start first request
    act(() => {
      result.current.request('/api/test1');
    });

    // Start second request before first completes
    act(() => {
      result.current.request('/api/test2');
    });

    expect(abortSpy).toHaveBeenCalled();
  });
});
