class MyPromise {
    constructor(cb) {
        if (!this instanceof MyPromise) {
            throw new TypeError('Promises must be constructed via new')
        }
        if (typeof cb !== 'function') {
            throw new TypeError('not a function')
        }
        // promise状态
        // 可以由 pending 转换为 fulfilled 或者 rejected
        this._status = 'pending';
        // resolve/reject 回调参数
        this._value = undefined;
        // then方法中注册的回调函数
        this._cbs = [];
        // reject是否被处理
        // 调用了then方法 则会尝试调用 onRejected
        this._handled = false;
        try {
            // 处理promise
            cb(this.resolveHandler.bind(this), this.rejectHandler.bind(this))
        } catch (e) {
            // 如果 cb中发生异常 调用rejectHandler
            this.rejectHandler(e)
        }
    }
    then(onFulfilled = null, onRejected = null) {
        this._handled = true;
        // then方法必须返回一个 promise 对象
        let promise2 = new this.constructor(function() {})
        // 如果是异步 当前状态仍然 pending
        if (this._status === 'pending') {
            this._cbs.push({ fulfilled: onFulfilled, rejected: onRejected, promise: promise2 })
        } else {
            // 如果是同步 当前状态为 fulfilled 或者 rejected
            // 在下一个时间片执行 then 中回调
            this.defer({ fulfilled: onFulfilled, rejected: onRejected, promise: promise2 })
        }
        return promise2
    }
    resolvePromise(promise, x) {
        let resolve = this.resolveHandler.bind(promise)
        let reject = this.rejectHandler.bind(promise)
        // x 和 promise 引用同一个对象
        if (promise === x) {
            return reject(new TypeError('A promise cannot be resolved with itself.'))
        }
        let called = false;
        // x 是一个函数或者对象
        if (x && (typeof x === 'object' || typeof x === 'function')) {
            try {
                // 取then方法
                let then = x.then;
                // 如果then是一个函数 认为 x 是一个Promise
                if (typeof then === 'function') {
                    then.call(x, (y) => {
                        if (!called) {
                            called = true;
                            this.resolvePromise(promise, y)
                        }
                    }, (r) => {
                        if (!called) {
                            called = true;
                            reject(r)
                        }
                    })
                } else {
                    // 如果 then 不是函数，以 x 为参数执行 promise
                    resolve(x)
                }
            } catch (e) {
                if (!called) {
                    called = true;
                    reject(e)
                }
            }
        } else {
            // 如果 x 不为对象或者函数，以 x 为参数执行 promise
            resolve(x)
        }
    }
    resolveHandler(v) {
        if (this._status === 'pending') {
            this._status = 'fulfilled';
            this._value = v;
            this._cbs.forEach(cb => this.defer(cb))
        }
    }
    rejectHandler(r) {
        if (this._status === 'pending') {
            this._status = 'rejected';
            this._value = r;
            if (!this._handled) {
                console.log('Possible Unhandled Promise Rejection:' + r)
            }
            this._cbs.forEach(cb => this.defer(cb))
        }
    }
    defer(cb) {
        setTimeout(() => {
            // 被回调的函数
            let fn = cb[this._status];
            // 如果被回调的不是一个函数
            // 交给下一个promise处理
            if (typeof fn !== 'function') {
                fn = this._status === 'fulfilled' ? this.resolveHandler : this.rejectHandler;
                return fn.call(cb.promise, this._value)
            }
            try {
                let x = fn(this._value);
                // 如果有返回值 根据返回值进行下一步处理
                this.resolvePromise(cb.promise, x)
            } catch (e) {
                // 如果发生异常，直接reject
                this.rejectHandler.call(cb.promise, e)
            }
        }, 1)
    }
    catch (onRejected) {
        return this.then(null, onRejected)
    }
    static resolve(v) {
        if (v && typeof v === 'object' && v instanceof MyPromise) {
            return v;
        }
        return new MyPromise(resolve => {
            resolve(v)
        })
    }
    static reject(r) {
        return new MyPromise((resolve, reject) => {
            reject(r)
        })
    }
    static all(promises) {
        if (Object.prototype.toString.call(promises) !== '[object Array]') {
            throw new TypeError('Promise.all accepts an array')
        }
        return new MyPromise((resolve, reject) => {
            let ary = [];
            for (let i = 0; i < promises.length; i++) {
                promises[i].then(res => {
                    ary[i] = res;
                    if (ary.length === promises.length) {
                        resolve(ary);
                    }
                }, rej => {
                    reject(rej)
                })
            }
        })
    }
}
export default MyPromise
