const arrayOfSize = size => new Array(size).join('.').split('.');
const flatMap = (array, lambda) => Array.prototype.concat.apply([], array.map(lambda || (n => n)));

class MaxConcurrency {
    async all({ promiseProviders, maxConcurrency }) {
        var promiseProviderEnumerator = promiseProviders[Symbol.iterator]();
        const allRunInSeries = arrayOfSize(maxConcurrency || promiseProviders.length)
            .map(n => this.runInSeries({ promiseProviderEnumerator }));
        const allPromisesInSeries = flatMap(await Promise.all(allRunInSeries));

        return Promise.all(allPromisesInSeries);
    }

    async runInSeries({ promiseProviderEnumerator, accumulatedValues }) {
        const nextPromiseProvider = promiseProviderEnumerator.next();

        return nextPromiseProvider.done ? accumulatedValues : await this.runInSeries({
            promiseProviderEnumerator,
            accumulatedValues: (accumulatedValues || []).concat(await nextPromiseProvider.value())
        });
    }
}

export const Concurrency = new MaxConcurrency();