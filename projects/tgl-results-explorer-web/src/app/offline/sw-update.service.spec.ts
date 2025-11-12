import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { SwUpdateService } from './sw-update.service';

describe('SwUpdateService', () => {
  let service: SwUpdateService;
  let swUpdateSpy: jasmine.SpyObj<SwUpdate>;
  let versionUpdatesSubject: Subject<VersionReadyEvent>;

  beforeEach(() => {
    versionUpdatesSubject = new Subject<VersionReadyEvent>();

    swUpdateSpy = jasmine.createSpyObj('SwUpdate', ['checkForUpdate', 'activateUpdate'], {
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable()
    });

    TestBed.configureTestingModule({
      providers: [
        SwUpdateService,
        { provide: SwUpdate, useValue: swUpdateSpy }
      ]
    });

    service = TestBed.inject(SwUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isOnline$', () => {
    it('should emit the current online status', (done) => {
      service.isOnline$.subscribe(isOnline => {
        expect(isOnline).toBe(navigator.onLine);
        done();
      });
    });

    it('should emit true when online event fires', (done) => {
      service.isOnline$.subscribe(isOnline => {
        if (isOnline) {
          expect(isOnline).toBe(true);
          done();
        }
      });

      // Simulate online event
      window.dispatchEvent(new Event('online'));
    });

    it('should emit false when offline event fires', (done) => {
      service.isOnline$.subscribe(isOnline => {
        if (!isOnline) {
          expect(isOnline).toBe(false);
          done();
        }
      });

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));
    });
  });

  describe('updateAvailable$', () => {
    it('should emit false initially', (done) => {
      service.updateAvailable$.subscribe(available => {
        expect(available).toBe(false);
        done();
      });
    });

    it('should emit true when VERSION_READY event is received', (done) => {
      let emissionCount = 0;

      service.updateAvailable$.subscribe(available => {
        emissionCount++;

        if (emissionCount === 1) {
          expect(available).toBe(false);
        } else if (emissionCount === 2) {
          expect(available).toBe(true);
          done();
        }
      });

      // Simulate VERSION_READY event
      versionUpdatesSubject.next({
        type: 'VERSION_READY',
        currentVersion: { hash: 'old' },
        latestVersion: { hash: 'new' }
      });
    });
  });

  describe('checkForUpdates', () => {
    it('should call swUpdate.checkForUpdate when enabled', async () => {
      swUpdateSpy.checkForUpdate.and.returnValue(Promise.resolve(false));

      await service.checkForUpdates();

      expect(swUpdateSpy.checkForUpdate).toHaveBeenCalled();
    });

    it('should not call swUpdate.checkForUpdate when disabled', async () => {
      Object.defineProperty(swUpdateSpy, 'isEnabled', { value: false });

      await service.checkForUpdates();

      expect(swUpdateSpy.checkForUpdate).not.toHaveBeenCalled();
    });
  });

  describe('activateUpdate', () => {
    let reloadSpy: jasmine.Spy;

    beforeEach(() => {
      reloadSpy = spyOn(window.location, 'reload');
    });

    it('should call swUpdate.activateUpdate and reload the page when enabled', async () => {
      swUpdateSpy.activateUpdate.and.returnValue(Promise.resolve(true));

      await service.activateUpdate();

      expect(swUpdateSpy.activateUpdate).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should not call swUpdate.activateUpdate when disabled', async () => {
      Object.defineProperty(swUpdateSpy, 'isEnabled', { value: false });

      await service.activateUpdate();

      expect(swUpdateSpy.activateUpdate).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });
});
