FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.9 AS base

ENV HF_HOME=/opt/hf_cache

# Update package lists and install dependencies
RUN yum update -y && \
    yum install -y \
    gcc \
    libgomp \
    libsndfile \
    gcc-c++

# Install txtai dependencies
RUN pip3 install --no-cache-dir torch==2.3.1 \
    torchvision==0.18.1 --index-url https://download.pytorch.org/whl/cpu \
    --target "${LAMBDA_TASK_ROOT}"
# Remove gcc and clean up cache to reduce image size
RUN yum remove -y gcc gcc-c++ && yum clean all && rm -rf /var/cache/yum

# validate installation
RUN PYTHONPATH="${LAMBDA_TASK_ROOT}" python3 -c "import sys, importlib.util as util; 1 if util.find_spec('nltk') else sys.exit(); import nltk; nltk.download('punkt')"

# Install the function's dependencies using file requirements.txt
# from your project folder.

COPY requirements.txt  .
RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

COPY aptgpt ./aptgpt
COPY setup.py .
COPY GoogleLogo.jpg .

RUN pip3 install . --target "${LAMBDA_TASK_ROOT}"


FROM base AS dev

RUN yum update -y && yum install -y \
    git \
    tar

FROM base AS descr_embedding_handler
# load the model
RUN PYTHONPATH="${LAMBDA_TASK_ROOT}" python -m aptgpt.DescrEmbedHandler

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "aptgpt.DescrEmbedHandler.handler" ]

FROM base AS image_embedding_handler
# load the model
RUN PYTHONPATH="${LAMBDA_TASK_ROOT}" python -m aptgpt.ImageEmbedHandler

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "aptgpt.ImageEmbedHandler.handler" ]