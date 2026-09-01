FROM python:3.11-slim

# Hugging Face Spaces menjalankan container sebagai user non-root port 7860
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Buat folder uploads
RUN mkdir -p uploads

# Expose port Hugging Face Spaces
EXPOSE 7860

# Jalankan dengan gunicorn di port 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "app:app"]
