# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for deutschmark's Alert Creator.
Run with: pyinstaller AlertCreator.spec
"""

import os
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

# Get the directory containing this spec file
spec_dir = os.path.dirname(os.path.abspath(SPEC))

a = Analysis(
    ['app.py'],
    pathex=[spec_dir],
    binaries=[],
    datas=[
        ('static', 'static'),
    ],
    hiddenimports=[
        'flask',
        'flask.json',
        'werkzeug',
        'werkzeug.serving',
        'jinja2',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AlertCreator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Keep console for status output
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
