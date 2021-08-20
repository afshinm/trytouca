<div align="center">
  <a href="https://touca.io" target="_blank" rel="noopener">
    <img alt="Touca Logo" height="48px" src="https://touca.io/logo/touca-logo-w-text.svg" />
  </a>
  <h1>Touca SDK for JavaScript</h1>
  <p>
    <a href="https://www.npmjs.com/package/@touca/node" target="_blank" rel="noopener"><img alt="npm version" src="https://img.shields.io/npm/v/@touca/node?color=blue" /></a>
    <a href="https://github.com/trytouca/touca-js/actions" target="_blank" rel="noopener"><img alt="Build Status" src="https://img.shields.io/github/workflow/status/trytouca/touca-js/touca-js-main" /></a>
    <a href="https://app.codecov.io/gh/trytouca/touca-js" target="_blank" rel="noopener"><img alt="Code Coverage" src="https://img.shields.io/codecov/c/github/trytouca/touca-js" /></a>
    <a href="https://app.codacy.com/gh/trytouca/touca-js" target="_blank" rel="noopener"><img alt="Code Quality" src="https://img.shields.io/codacy/grade/dca09feb49f142468bdd864a8015a53f" /></a>
    <a href="https://github.com/trytouca/touca-js/blob/main/LICENSE" target="_blank" rel="noopener"><img alt="License" src="https://img.shields.io/github/license/trytouca/touca-js" /></a>
  </p>
</div>

Touca helps you understand the true impact of your day to day code changes
on the behavior and performance of your overall software, as you write code.

[![Touca Server](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.png)](https://touca-public-assets.s3.us-east-2.amazonaws.com/touca-screenshot-suite-page.png)

Touca SDKs let you describe the behavior and performance of your code by
capturing values of interesting variables and runtime of important functions.
We remotely compare your description against a trusted version of your
software, visualize all differences, and report them in near real-time.

## 🧑‍🔧 Install

You can install Touca with [via NPM][npm]:

```bash
npm install @touca/node
```

We formally support Node.js v12 and newer on Windows, Linux and macOS platforms.

## 👀 Sneak Peak

> For a more thorough guide of how to use Touca SDK for Node.js, check
> out the `examples` directory or visit our documentation website at
> [docs.touca.io](https://docs.touca.io).

Let us imagine that we want to test a software workflow that reports
whether a given number is prime.

```ts
function is_prime(input: number): boolean;
```

We can use unit testing in which we hard-code a set of input numbers
and list our expected return value for each input. In this example,
the input and output of our code under test are a number and a boolean.
If we were testing a video compression algorithm, they may have been
video files. In that case:

*   Describing the expected output for a given video file would be difficult.

*   When we make changes to our compression algorithm, accurately reflecting
    those changes in our expected values would be time-consuming.

*   We would need a large number of input video files to gain confidence that
    our algorithm works correctly.

Touca makes it easier to continuously test workflows of any complexity
and with any number of test cases.

```ts
import { touca } from '@touca/node';
import { is_prime } from './code_under_test';

touca.workflow('is_prime_test', (testcase: string) => {
  const number = Number.parseInt(testcase);
  touca.add_result('is_prime_output', is_prime(number));
});

touca.run();
```

Touca tests have two main differences compared to typical unit tests:

*   We have fully decoupled our test inputs from our test logic. We refer to
    these inputs as "test cases". The SDK retrieves the test cases from the
    command line, or a file, or a remote Touca server and feeds them one by one
    to our code under test.

*   We have removed the concept of *expected values*. With Touca, we only
    describe the *actual* behavior and performance of our code under test
    by capturing values of interesting variables and runtime of important
    functions, anywhere within our code.
    For each test case, the SDK submits this description to a remote server
    which compares it against the description for a trusted version of our code.
    The server visualizes any differences and reports them in near real-time.

We can run Touca tests with any number of inputs from the command line:

```bash
node dist/is_prime_test.js
  --api-key <TOUCA_API_KEY>
  --api-url <TOUCA_API_URL>
  --revision v1.0
  --testcase 13 17 51
```

Where `TOUCA_API_KEY` and `TOUCA_API_URL` can be obtained from the
Touca server at [app.touca.io](https://app.touca.io).
This command produces the following output:

```text
Touca Test Framework
Suite: is_prime_test
Revision: v1.0

 (  1 of 3  ) 13                   (pass, 127 ms)
 (  2 of 3  ) 17                   (pass, 123 ms)
 (  3 of 3  ) 51                   (pass, 159 ms)

Processed 3 of 3 testcases
Test completed in 565 ms
```

## ✨ Features

Touca is very effective in addressing common problems in the following
situations:

*   When we need to test our workflow with a large number of inputs.

*   When the output of our workflow is too complex, or too difficult
    to describe in our unit tests.

*   When interesting information to check for regression is not exposed
    through the interface of our workflow.

The fundamental design features of Touca that we highlighted earlier
can help us test these workflows at any scale.

*   Decoupling our test input from our test logic, can help us manage our
    long list of inputs without modifying the test logic. Managing that list
    on a remote server accessible to all members of our team, can help us add
    notes to each test case, explain why they are needed and track how their
    performance changes over time.

*   Submitting our test results to a remote server, instead of storing them
    in files, can help us avoid the mundane tasks of managing and processing
    of those results. The Touca server retains test results and makes them
    accessible to all members of the team. It compares test results using
    their original data types and reports discovered differences in real-time
    to all interested members of our team. It allows us to audit how our
    software evolves over time and provides high-level information about
    our tests.

## 📖 Documentation

*   If you are new to Touca, the best place to start is our
    [Quickstart Guide][docs-quickstart] on our documentation website.

*   For information on how to use our JavaScript SDK,
    see our [JavaScript SDK Documentation][docs-js].

*   If you cannot wait to start writing your first test with Touca,
    see our [JavaScript API Reference][docs-js-api].

## 🙋 Ask for Help

We want Touca to work well for you. If you need help, have any questions, or
like to provide feedback, send us a note through the Intercom at
[touca.io][touca.io] or email us at <hello@touca.io>.

## 🚀 What's Next

Touca client libraries are free and open-source. Our cloud-hosted Touca server
at [touca.io][touca.io] has a free forever plan. You can create an account and
explore Touca on your own. We are also happy to [chat 1:1][calendly] to help
you get on-boarded and answer any questions you may have in the process.
We'd love to learn more about you, understand your software and its requirements,
and help you decide if Touca would be useful to you and your team.

## License

This repository is released under the Apache-2.0 License. See [`LICENSE`][license].

[touca.io]: https://touca.io

[calendly]: https://calendly.com/ghorbanzade/30min

[license]: https://github.com/trytouca/touca-js/blob/main/LICENSE

[npm]: https://npmjs.com/package/@touca/node

[docs-quickstart]: https://docs.touca.io/getting-started/quickstart

[docs-js]: https://docs.touca.io/api/js-sdk

[docs-js-api]: https://app.touca.io/docs/clients/js/api.html