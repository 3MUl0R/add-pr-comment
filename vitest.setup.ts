// @actions/github@8 uses undici.fetch directly (not globalThis.fetch) via getProxyFetch,
// which bypasses MSW's fetch interception. We need to intercept at the module level.
//
// We replace the require('undici') result in the module cache with a proxy that
// redirects fetch calls to globalThis.fetch, which MSW can intercept.
import Module from 'node:module'

const originalRequire = Module.prototype.require

// @ts-expect-error - monkey-patching require
Module.prototype.require = function patchedRequire(id: string) {
  const result = originalRequire.apply(this, [id])
  if (id === 'undici' && result && typeof result.fetch === 'function') {
    return new Proxy(result, {
      get(target, prop) {
        if (prop === 'fetch') {
          return (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args)
        }
        return target[prop]
      },
    })
  }
  return result
}
