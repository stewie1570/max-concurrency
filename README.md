# max-concurrency

Sometimes you don't want to use Promise.all because sometimes you don't want all the promises you pass to it to be all in-flight at the same time. This package will let you do that. The only difference in the API _(other than the object & method name)_ is instead of passing the method an array of promises, you pass it an array of functions that return the promises. This way the package can control when the promises are fired off.

```jsx
expect(await Concurrency.all({
    promiseGenerators: [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3),
        () => Promise.resolve(4),
        () => Promise.resolve(5),
        () => Promise.resolve(6),
        () => Promise.resolve(7),
        () => Promise.resolve(8),
        () => Promise.resolve(9)
    ],
    maxConcurrency: 3
})).toEqual([1, 2, 3]);
```