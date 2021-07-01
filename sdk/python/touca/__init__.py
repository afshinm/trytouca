#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

"""
Entry-point to the Touca SDK for Python.

You can install this sdk via ``pip install touca`` and import it in your code via::

    import touca

Alternatively, you can import individual functions which may be useful in rare
cases if and when you want to call them from production code::

    from touca import add_result

If you are just getting started with Touca, we generally recommend that you
install the SDK as a development-only dependency.
"""

from typing import Any, Callable, Dict, List, Type
from ._client import Client
from ._utils import scoped_timer
from ._version import __version__


def clientmethod(f):
    import inspect

    f.__doc__ = inspect.getdoc(getattr(Client, f.__name__))
    return f


@clientmethod
def configure(**kwargs) -> bool:
    return Client.instance().configure(**kwargs)


@clientmethod
def is_configured() -> bool:
    return Client.instance().is_configured()


@clientmethod
def configuration_error() -> str:
    return Client.instance().configuration_error()


@clientmethod
def get_testcases() -> List[str]:
    return Client.instance().get_testcases()


@clientmethod
def declare_testcase(name: str):
    Client.instance().declare_testcase(name)


@clientmethod
def forget_testcase(name: str):
    Client.instance().forget_testcase(name)


@clientmethod
def add_result(key: str, value: Any):
    Client.instance().add_result(key, value)


@clientmethod
def add_assertion(key: str, value: Any):
    Client.instance().add_assertion(key, value)


@clientmethod
def add_array_element(key: str, value: Any):
    Client.instance().add_array_element(key, value)


@clientmethod
def add_hit_count(key: str):
    Client.instance().add_hit_count(key)


@clientmethod
def add_metric(key: str, milliseconds: int):
    Client.instance().add_metric(key, milliseconds)


@clientmethod
def start_timer(key: str):
    Client.instance().start_timer(key)


@clientmethod
def stop_timer(key: str):
    Client.instance().stop_timer(key)


@clientmethod
def add_serializer(datatype: Type, serializer: Callable[[Any], Dict]):
    Client.instance().add_serializer(datatype, serializer)


@clientmethod
def save_binary(key: str, cases: List[str] = []):
    Client.instance().save_binary(key, cases)


@clientmethod
def save_json(key: str, cases: List[str] = []):
    Client.instance().save_json(key, cases)


@clientmethod
def post():
    return Client.instance().post()


@clientmethod
def seal():
    return Client.instance().seal()
