import setuptools

setuptools.setup(
    name="AptGptEmbeddings",
    version="0.0.1",
    author="AptGpt",
    author_email="jgmath2000@gmail.com",
    description="AptGptEmbeddings",
    long_description="AptGptEmbeddings",
    long_description_content_type="text/markdown",
    url="https://github.com/pypa/sampleproject",
    project_urls={
        "Bug Tracker": "https://github.com/pypa/sampleproject/issues",
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    package_dir={"": "."},
    packages=setuptools.find_packages(where="."),
    python_requires=">=3.9",
)