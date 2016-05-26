try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

setup(
    name='cosmos',
    version='0.01.093.02',
    packages=['cosmos', 'cosmos.common', 'cosmos.admin', 'cosmos.auth', 'cosmos.admin.samples',
              'cosmos.datamonitor', 'cosmos.dataservice','cosmos.rbac', 'cosmos.schema',
              'cosmos.certmgr', 'cosmos.service', 'cosmos.processors', 'cosmos.msgq', 'cosmos.bees',
              'cosmos.bees.celery', 'test'],
    url='http://cosmosframework.com',
    license='MIT License',
    author='Maruf Maniruzzaman',
    author_email='marufm@cosmosframework.com',
    description='Thin server application framework',

    classifiers=[
        'Development Status :: 3 - Alpha',

        # Indicate who your project is intended for
        'Intended Audience :: Developers',
        'Topic :: Software Development :: Libraries :: Application Frameworks',

        # Pick your license as you wish (should match "license" above)
        'License :: OSI Approved :: MIT License',

        'Programming Language :: Python :: 2.7',

        'Programming Language :: Python :: 3.5',

        'Programming Language :: JavaScript'
    ],

    install_requires=['tornado', 'motor', 'mongolog', 'mock', 'requests', 'python-memcached', 'pycrypto', 'python_jwt',
                      'funcsigs', 'pbr', 'pika', 'celery', 'pyopenssl'],
    # python 2 - pip install future

    entry_points = {
        'console_scripts': [
            'cosmos = cosmos.admin.commands:admin_main'
        ]
    },

    test_suite="test"
)
