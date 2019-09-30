import _ from 'lodash'

type ErrorMapper = (error: any) => any;

type PromiseProvider = () => Promise<any>;

type MaxConcurrencyRequest = {
    promiseProviders: Array<PromiseProvider>,
    maxConcurrency?: number,
    mapErrors?: ErrorMapper
}

type SeriesContext = {
    numberedPromiseProviderEnumerator: IterableIterator<{
        promiseProvider: PromiseProvider;
        index: number;
    }>,
    accumulatedValues?: Array<any>,
    mapErrors?: ErrorMapper
}

class MaxConcurrency {
    async all({ promiseProviders, maxConcurrency, mapErrors }: MaxConcurrencyRequest) {
        const numberedPromiseProviders = promiseProviders.map((promiseProvider, index) => ({ promiseProvider, index }));
        const numberedPromiseProviderEnumerator = numberedPromiseProviders[Symbol.iterator]();
        const configuredConcurrencyLimit = maxConcurrency || numberedPromiseProviders.length;
        const allRunInSeries = _.range(Math.min(configuredConcurrencyLimit, numberedPromiseProviders.length))
            .map(n => this.runInSeries({ numberedPromiseProviderEnumerator, mapErrors }));

        return _(await Promise.all(allRunInSeries))
            .flatMap()
            .orderBy(({ index }) => index)
            .map(({ value }) => value)
            .value();
    }

    async runInSeries({ numberedPromiseProviderEnumerator, accumulatedValues, mapErrors }: SeriesContext): Promise<any> {
        const errorMappedValueFrom = async ({ promiseProvider }: { promiseProvider: PromiseProvider }) => {
            try {
                return await promiseProvider();
            }
            catch (error) {
                return mapErrors && mapErrors(error);
            }
        }
        const numberedValueFrom = async ({ promiseProvider, index }: { promiseProvider: PromiseProvider, index: number }) => ({
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