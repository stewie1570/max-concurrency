import _ from 'lodash'

class MaxConcurrency {
    async all({ promiseProviders, maxConcurrency, mapErrors }) {
        const numberedPromiseProviders = promiseProviders.map((promiseProvider, index) => ({ promiseProvider, index }));
        const numberedPromiseProviderEnumerator = numberedPromiseProviders[Symbol.iterator]();
        const allRunInSeries = _.range(maxConcurrency || numberedPromiseProviders.length)
            .map(n => this.runInSeries({ numberedPromiseProviderEnumerator, mapErrors }));

        return _(await Promise.all(allRunInSeries))
            .flatMap()
            .orderBy(({ index }) => index)
            .map(({ value }) => value)
            .value();
    }

    async runInSeries({ numberedPromiseProviderEnumerator, accumulatedValues, mapErrors }) {
        const errorMappedValueFrom = async ({ promiseProvider }) => {
            try {
                return await promiseProvider();
            }
            catch (error) {
                return mapErrors(error);
            }
        }
        const numberedValueFrom = async ({ promiseProvider, index }) => ({
            index,
            value: mapErrors ? await errorMappedValueFrom({ promiseProvider }) : await promiseProvider()
        });
        const numberedPromiseProvider = numberedPromiseProviderEnumerator.next();

        return numberedPromiseProvider.done ? accumulatedValues : await this.runInSeries({
            numberedPromiseProviderEnumerator,
            accumulatedValues: (accumulatedValues || []).concat(await numberedValueFrom(numberedPromiseProvider.value)),
            mapErrors
        });
    }
}

export const Concurrency = new MaxConcurrency();