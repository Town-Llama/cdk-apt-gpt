FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.9 as base

# Install the function's dependencies using file requirements.txt
# from your project folder.

COPY requirements.txt  .
RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

COPY index.py .
COPY setup.py .

RUN pip3 install . --target "${LAMBDA_TASK_ROOT}"


FROM base as dev

RUN yum update -y && yum install -y git tar


FROM base as deploy

RUN PYTHONPATH="${LAMBDA_TASK_ROOT}" python index.py

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.lambda_handler" ]
