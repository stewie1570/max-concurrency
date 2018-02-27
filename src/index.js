const arrayOfSize = size => new Array(size).join('.').split('.');
const flatMap = (array, lambda) => Array.prototype.concat.apply([], array.map(lambda || (n => n)));

class MaxConcurrency {
    async all({ promiseGenerators, maxConcurrency }) {
        var promiseGenerationEnumerator = promiseGenerators[Symbol.iterator]();
        const allRunInSeries = arrayOfSize(maxConcurrency).map(n => this.runInSeries({ promiseGenerationEnumerator }));
        const allPromisesInSeries = flatMap(await Promise.all(allRunInSeries));

        return Promise.all(allPromisesInSeries);
    }

    async runInSeries({ promiseGenerationEnumerator, accumulatedValues }) {
        const nextPromiseGenerator = promiseGenerationEnumerator.next();

        return nextPromiseGenerator.done ? accumulatedValues : await this.runInSeries({
            promiseGenerationEnumerator,
            accumulatedValues: (accumulatedValues || []).concat(await nextPromiseGenerator.value())
        });
    }
}

export const Concurrency = new MaxConcurrency();