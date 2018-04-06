# max-concurrency

[![Build](https://travis-ci.org/stewie1570/max-concurrency.svg)](https://travis-ci.org/stewie1570/max-concurrency)
[![npm version](https://badge.fury.io/js/max-concurrency.svg)](https://badge.fury.io/js/max-concurrency)

Sometimes you don't want to use Promise.all because sometimes you don't want all the promises you pass to it to be all in-flight at the same time. This package will allow you to limit how many promises are in-flight at the same time. The reason this API takes a list of promise providing functions is because if you passed it an array of promises, those promises would all already be in-flight.



```jsx
import { Concurrency } from 'max-concurrency'

expect(await Concurrency.all({
    promiseProviders: [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3),
        () => Promise.resolve(4)
    ],
    maxConcurrency: 3
})).toEqual([1, 2, 3]);
```

This package also allows more control over error handling. Promise.all() will reject/throw when it encounters an error (ie. a rejected promise). This package will default to that same behavior but will also allow you to define an error mapper. This will map errors to "errored values" in the results and this allows for the rest of the promises to continue.

```jsx
expect(await Concurrency.all({
    promiseProviders: [
        () => Promise.resolve(1),
        () => Promise.reject(new Error("the error")),
        () => Promise.resolve(3)
    ],
    mapErrors: ({ message }) => ({ errorMessage: message })
})).toEqual([1, { errorMessage: "the error" }, 3]);
```

Just like Promise.all, this package will return the resolved values in the same order as the array of promise providers passed to it (not the order that the promises resolved in).