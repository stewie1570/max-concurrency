import _ from 'lodash'

class MaxConcurrency {
    async all({ promiseProviders, maxConcurrency }) {
        var numberedPromiseProviders = promiseProviders.map((promiseProvider, index) => ({ promiseProvider, index }));
        var numberedPromiseProviderEnumerator = numberedPromiseProviders[Symbol.iterator]();
        const allRunInSeries = _.range(maxConcurrency || numberedPromiseProviders.length)
            .map(n => this.runInSeries({ numberedPromiseProviderEnumerator }));

        return _(await Promise.all(allRunInSeries))
            .flatMap()
            .orderBy(({ index }) => index)
            .map(({ value }) => value)
            .value();
    }

    async runInSeries({ numberedPromiseProviderEnumerator, accumulatedValues }) {
        const numberedValueFrom = async ({ promiseProvider, index }) => ({ index, value: await promiseProvider() });
        const numberedPromiseProvider = numberedPromiseProviderEnumerator.next();

        return numberedPromiseProvider.done ? accumulatedValues : await this.runInSeries({
            numberedPromiseProviderEnumerator,
            accumulatedValues: (accumulatedValues || []).concat(await numberedValueFrom(numberedPromiseProvider.value))
        });
    }
}

export const Concurrency = new MaxConcurrency();