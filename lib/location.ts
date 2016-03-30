/**
 * This is a fork of the Location service in Angular 2's Component Router.
 * It exposes location updates as a BehaviorSubject, letting the router
 * observe location changes.
 */
import { BehaviorSubject } from 'rxjs/subject/BehaviorSubject';
import { Subscriber } from 'rxjs/Subscriber';
import { LocationStrategy } from 'angular2/src/router/location/location_strategy';
import { UrlChangeEvent, PlatformLocation } from 'angular2/src/router/location/platform_location';
import { BrowserPlatformLocation } from 'angular2/src/router/location/browser_platform_location';
import { Injectable, Inject, Provider, provide } from 'angular2/core';

export interface LocationChange {
  url: string;
  pop: boolean;
  type: string;
}

/**
 * `Location` is a service that applications can use to interact with a browser's URL.
 * Depending on which {@link LocationStrategy} is used, `Location` will either persist
 * to the URL's path or the URL's hash segment.
 *
 * Note: it's better to use {@link Router#navigate} service to trigger route changes. Use
 * `Location` only if you need to interact with or create normalized URLs outside of
 * routing.
 *
 * `Location` is responsible for normalizing the URL against the application's base href.
 * A normalized URL is absolute from the URL host, includes the application's base href, and has no
 * trailing slash:
 * - `/my/app/user/123` is normalized
 * - `my/app/user/123` **is not** normalized
 * - `/my/app/user/123/` **is not** normalized
 *
 * ### Example
 *
 * ```
 * import {Component} from 'angular2/core';
 * import {
 *   ROUTER_DIRECTIVES,
 *   ROUTER_PROVIDERS,
 *   RouteConfig,
 *   Location
 * } from 'angular2/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  {...},
 * ])
 * class AppCmp {
 *   constructor(location: Location) {
 *     location.go('/foo');
 *   }
 * }
 *
 * bootstrap(AppCmp, [ROUTER_PROVIDERS]);
 * ```
 */
@Injectable()
export class Location extends BehaviorSubject<LocationChange>{
  private _baseHref: string;

  constructor(public platformStrategy: LocationStrategy) {
    super(undefined);

    platformStrategy.onPopState(event => this._update(true, event.type));

    var browserBaseHref = this.platformStrategy.getBaseHref();
    this._baseHref = stripTrailingSlash(stripIndexHtml(browserBaseHref));
    this._update();
  }

  private _update(pop: boolean = false, type = 'push') {
    this.next({ url: this.path(), pop, type });
  }

  /**
   * Returns the normalized URL path.
   */
  path(): string {
    return this.normalize(this.platformStrategy.path());
  }

  /**
   * Given a string representing a URL, returns the normalized URL path without leading or
   * trailing slashes
   */
  normalize(url: string): string {
    return stripTrailingSlash(_stripBaseHref(this._baseHref, stripIndexHtml(url)));
  }

  /**
   * Given a string representing a URL, returns the platform-specific external URL path.
   * If the given URL doesn't begin with a leading slash (`'/'`), this method adds one
   * before normalizing. This method will also add a hash if `HashLocationStrategy` is
   * used, or the `APP_BASE_HREF` if the `PathLocationStrategy` is in use.
   */
  prepareExternalUrl(url: string): string {
    if (url.length > 0 && !url.startsWith('/')) {
      url = '/' + url;
    }
    return this.platformStrategy.prepareExternalUrl(url);
  }

  /**
   * Changes the browsers URL to the normalized version of the given URL, and pushes a
   * new item onto the platform's history.
   */
  go(path: string, query: string = ''): void {
    this.platformStrategy.pushState(null, '', path, query);
    this._update();
  }

  /**
   * Changes the browsers URL to the normalized version of the given URL, and replaces
   * the top item on the platform's history stack.
   */
  replaceState(path: string, query: string = ''): void {
    this.platformStrategy.replaceState(null, '', path, query);
    this._update();
  }

  /**
   * Navigates forward in the platform's history.
   */
  forward(): void {
    this.platformStrategy.forward();
  }

  /**
   * Navigates back in the platform's history.
   */
  back(): void {
    this.platformStrategy.back();
  }
}

function _stripBaseHref(baseHref: string, url: string): string {
  if (baseHref.length > 0 && url.startsWith(baseHref)) {
    return url.substring(baseHref.length);
  }
  return url;
}

function stripIndexHtml(url: string): string {
  if (/\/index.html$/g.test(url)) {
    // '/index.html'.length == 11
    return url.substring(0, url.length - 11);
  }
  return url;
}

function stripTrailingSlash(url: string): string {
  if (/\/$/g.test(url)) {
    url = url.substring(0, url.length - 1);
  }
  return url;
}


export const LOCATION_PROVIDERS = [
  provide(Location, { useClass: Location }),
  provide(PlatformLocation, { useClass: BrowserPlatformLocation })
];
