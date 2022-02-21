# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import argparse
import configparser
import os
import sys

from loguru import logger
from touca import __version__
from touca.cli._merge import Merge
from touca.cli._post import Post
from touca.cli._run import Run
from touca.cli._unzip import Unzip
from touca.cli._update import Update
from touca.cli._zip import Zip
from touca.helpers._printer import Printer

config = configparser.ConfigParser()
options = {}


def find_latest_pypi_version():
    from json import loads
    from urllib.request import urlopen

    with urlopen("https://pypi.org/pypi/touca/json") as response:
        data = loads(response.read())
        return data["info"]["version"]


def warn_outdated_version():
    from packaging import version

    latest_version = find_latest_pypi_version()
    if version.parse(latest_version) <= version.parse(__version__):
        return
    fmt = (
        "You are using touca version {}; however, version {} is available."
        + "\nConsider upgrading by running 'pip install --upgrade touca'."
    )
    Printer.print_warning(fmt, __version__, latest_version)


@logger.catch
def main(args=None):
    operations = {
        "merge": lambda opt: Merge(opt),
        "post": lambda opt: Post(opt),
        "run": lambda opt: Run(opt),
        "unzip": lambda opt: Unzip(opt),
        "update": lambda opt: Update(opt),
        "zip": lambda opt: Zip(opt),
    }
    parser = argparse.ArgumentParser(
        description="Work seamlessly with Touca from the command line.",
        add_help=True,
        formatter_class=argparse.RawTextHelpFormatter,
        epilog="See https://docs.touca.io for more information.",
    )
    parser.add_argument(
        "-v", "--version", action="version", version=f"%(prog)s v{__version__}"
    )
    parser.add_argument(
        "command",
        nargs="?",
        choices=operations.keys(),
        help="one of " + ", ".join([f'"{k}"' for k in operations.keys()]),
        metavar="command",
    )
    parsed, remaining = parser.parse_known_args(sys.argv[1:] if args is None else args)
    options = vars(parsed)

    if "command" not in options.keys() or options.get("command") is None:
        parser.print_help()
        warn_outdated_version()
        return True

    operation_name = options.get("command")
    if operation_name not in operations:
        logger.error(f"invalid command: {operation_name}")
        return False
    operation = operations.get(operation_name)(options)

    try:
        operation.parse(remaining)
    except ValueError as err:
        print(err, file=sys.stderr)
        return False
    except:
        operation.parser().print_help()
        return False

    if "touca-utils" in options.keys():
        if not os.path.exists(options.get("touca-utils")):
            logger.error(f"touca utils application does not exist")
            return False

    # configure logger

    logger.remove()
    logger.add(
        sys.stdout,
        level="DEBUG",
        colorize=True,
        format="<green>{time:HH:mm:ss!UTC}</green> | <cyan>{level: <7}</cyan> | <lvl>{message}</lvl>",
    )
    logger.add(
        "logs/runner_{time:YYMMDD!UTC}.log",
        level="DEBUG",
        rotation="1 day",
        compression="zip",
    )

    if not operation.run():
        logger.error(f"failed to perform operation {operation_name}")
        return False

    warn_outdated_version()
    return True


if __name__ == "__main__":
    sys.exit(main())