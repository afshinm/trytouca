#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from collections import ChainMap
from argparse import ArgumentParser, ArgumentTypeError
import logging

from operation import Operation
from common import run_cmd

logger = logging.getLogger(__name__)

def compress7z(srcDir, outputDir):
    """
    """
    dstFile = os.path.join(outputDir, os.path.basename(srcDir)) + '.7z'
    if os.path.exists(dstFile):
        logger.warning(f'compressed file {dstFile} already exists')
        return False
    logger.info(f'compressing directory {srcDir} into {dstFile}')
    runCmd = ["C:\\Program Files\\7-Zip\\7z.exe", 'a', '-mx1', '-mmt12', '-sdel', dstFile, srcDir]
    file_out = os.path.join('D:\\Meerkat\\Lab\\Logs', 'zipit', os.path.basename(srcDir)) + '.log'
    exit_status = run_cmd(runCmd, file_out=file_out, file_err=file_out)
    if 0 != exit_status:
        logger.warning(f'failed to compress {srcDir}')
        if exit_status is not None:
            logger.warning(f'program 7zip returned code {exit_status}')
        return False
    logger.info(f'compressed {srcDir}')
    return True

class Zip(Operation):

    def __init__(self, options: dict):
        self.__options = options

    def name(self) -> str:
        return 'zip'

    def parser(self) -> ArgumentParser:
        parser = ArgumentParser()
        parser.add_argument('--src', help='src help')
        parser.add_argument('--out', help='out help')
        return parser

    def parse(self, args):
        parsed, _ = self.parser().parse_known_args(args)
        for key in ['src', 'out']:
            if key not in vars(parsed).keys() or vars(parsed).get(key) is None:
                raise ArgumentTypeError(f'missing key: {key}')
        self.__options = { **self.__options, **vars(parsed) }

    def run(self) -> bool:
        srcDir = self.__options.get('src')
        outDir = self.__options.get('out')
        if not os.path.exists(srcDir):
            logger.error(f'directory {srcDir} does not exist')
            return False
        for fselement in os.listdir(srcDir):
            fspath = os.path.join(srcDir, fselement)
            if not os.path.isdir(fspath):
                continue
            logger.info(f"extracting file {fspath}")
            if not os.path.exists(outDir):
                os.makedirs(outDir)
            if not compress7z(fspath, outDir):
                logger.error(f'failed to compress {fspath}')
                return False
            logger.info(f'compressed {fspath}')
        logger.info('compressed all sub-directories')
        return True
