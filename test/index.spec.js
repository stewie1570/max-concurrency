import { Concurrency } from '../src/index'
import { range } from 'lodash'

const willResolve = value => new Promise((resolve, reject) => setTimeout(() => resolve(value), 0));
const willReject = value => new Promise((resolve, reject) => setTimeout(() => reject(value), 0));
const manualResolvablePromiseFrom = ({ value }) => {
    var resolve = undefined;
    var promise = new Promise((resolver, reject) => { resolve = () => resolver(value); })

    return { resolve, promise };
}

describe("Concurrency", () => {
    describe("Run all(...)", () => {
        it("should run all promise providers and return the results", async () => {
            expect(await Concurrency.all({
                promiseProviders: [
                    () => willResolve(1),
                    () => willResolve(2),
                    () => willResolve(3)
                ]
            })).toEqual([1, 2, 3]);
        });

        it("should throw when a promise rejects/throws", async () => {
            var receivedError;
            var theThrownError = new Error("some error");

            try {
                await Concurrency.all({
                    promiseProviders: [
                        () => willResolve(1),
                        () => willReject(theThrownError),
                        () => willResolve(3)
                    ]
                });
            }
            catch (error) {
                receivedError = error;
            }

            expect(receivedError).toBe(theThrownError);
        });

        it("should allow mapping errored promises", async () => {
            expect(await Concurrency.all({
                promiseProviders: [
                    () => willResolve(1),
                    () => willReject(new Error("the error")),
                    () => willResolve(3)
                ],
                mapErrors: ({ message }) => ({ errorMessage: message })
            })).toEqual([1, { errorMessage: "the error" }, 3]);
        });

        it("should return in the order received (not in the order that the promises resoved in)", async () => {
            const resolvablePromises = [
                manualResolvablePromiseFrom({ value: 1 }),
                manualResolvablePromiseFrom({ value: 2 }),
                manualResolvablePromiseFrom({ value: 3 }),
                manualResolvablePromiseFrom({ value: 4 }),
                manualResolvablePromiseFrom({ value: 5 }),
                manualResolvablePromiseFrom({ value: 6 }),
                manualResolvablePromiseFrom({ value: 7 }),
                manualResolvablePromiseFrom({ value: 8 }),
                manualResolvablePromiseFrom({ value: 9 })
            ];

            var whenAllResolved = Concurrency.all({
                promiseProviders: resolvablePromises.map(resolvablePromise => () => resolvablePromise.promise),
                maxConcurrency: 3
            });

            resolvablePromises[3].resolve();
            resolvablePromises[4].resolve();
            resolvablePromises[0].resolve();
            resolvablePromises[8].resolve();
            resolvablePromises[2].resolve();
            resolvablePromises[7].resolve();
            resolvablePromises[6].resolve();
            resolvablePromises[1].resolve();
            resolvablePromises[5].resolve();

            expect(await whenAllResolved).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });

        it("should limit the concurrency", async () => {
            var promisesInFlight = 0;
            var promiseProviders = range(10).map(n => async () => {
                promisesInFlight++;
                var ret = await willResolve(promisesInFlight);
                promisesInFlight--;
                return ret;
            });

            expect(Math.max(...await Concurrency.all({ promiseProviders, maxConcurrency: 3 }))).toBe(3);
        });

        it("should default the concurrency limit to the number of promise providers", async () => {
            var promisesInFlight = 0;
            var promiseProviders = range(10).map(n => async () => {
                promisesInFlight++;
                var ret = await willResolve(promisesInFlight);
                promisesInFlight--;
                return ret;
            });

            expect(Math.max(...await Concurrency.all({ promiseProviders }))).toBe(10);
        });
    });
});