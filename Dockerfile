# Dockerfile for my-safe-sandbox
# A minimal, secure Python sandbox environment for code execution

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN useradd -m -u 1000 sandbox && \
    chown -R sandbox:sandbox /app

# Install minimal Python packages if needed
# Keep this minimal for security
RUN pip install --no-cache-dir --upgrade pip

# Switch to non-root user
USER sandbox

# Set Python to run in unbuffered mode
ENV PYTHONUNBUFFERED=1

# Default command (will be overridden)
CMD ["python", "--version"]
