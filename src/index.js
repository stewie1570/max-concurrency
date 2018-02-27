const arrayOfSize = size => new Array(size).join('.').split('.');
const flatMap = (array, lambda) => Array.prototype.concat.apply([], array.map(lambda || (n => n)));

class MaxConcurrency {
    async all({ promiseGenerators, maxConcurrency }) {
        var promiseGenerationEnumerator = promiseGenerators[Symbol.iterator]();
        const allRunInSeries = arrayOfSize(maxConcurrency).map(n => this.runInSeries({ promiseGenerationEnumerator }));
        const allPromisesInSeries = flatMap(await Promise.all(allRunInSeries));

        return Promise.all(allPromisesInSeries);
    }

    async runInSeries({ promiseGenerationEnumerator, accumalatedValues }) {
        const nextPromiseGenerator = promiseGenerationEnumerator.next();

        return nextPromiseGenerator.done ? accumalatedValues : await this.runInSeries({
            promiseGenerationEnumerator,
            accumalatedValues: (accumalatedValues || []).concat(await nextPromiseGenerator.value())
        });
    }
}

export const Concurrency = new MaxConcurrency();