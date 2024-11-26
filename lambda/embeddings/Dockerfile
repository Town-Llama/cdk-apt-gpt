FROM --platform=linux/amd64 python:3.9-slim AS base

ENV HF_HOME=/opt/hf_cache

RUN echo "Acquire::http::Pipeline-Depth 0; \n Acquire::http::No-Cache true; \n Acquire::BrokenProxy    true;" > /etc/apt/apt.conf.d/99fixbadproxy

# Update package lists and install dependencies
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    gcc \
    libgomp1 \
    libsndfile1 \
    g++ \
    git \
    tar && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# Install txtai dependencies
RUN pip3 install --no-cache-dir torch==2.3.1 \
    torchvision==0.18.1 --index-url https://download.pytorch.org/whl/cpu

# Install Flask and other dependencies from PyPI
RUN pip3 install --no-cache-dir flask

# Remove unnecessary packages to reduce image size
RUN apt-get remove -y gcc g++ && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install the function's dependencies using file requirements.txt
COPY requirements.txt  .
RUN pip3 install -r requirements.txt

# Copy project files
COPY aptgpt ./aptgpt
COPY setup.py .
COPY GoogleLogo.jpg .

RUN pip3 install .

FROM base AS descr_embedding_handler
CMD [ "python3", "-m", "aptgpt.DescrEmbedHandler" ]

FROM base AS image_embedding_handler
CMD [ "python3", "-m", "aptgpt.ImageEmbedHandler" ]
