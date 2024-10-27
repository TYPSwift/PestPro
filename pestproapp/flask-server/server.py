from flask import Flask 
from ibm_watsonx_ai import APIClient
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

app = Flask(__name__)

# Memebers API route 
@app.route("/members")
def memebrs(): 
    return {"members": ["Member1", "Member2", "Member3"]}



if __name__ == "__main__":
    app.run(debug=True)




credentials = Credentials(
    url = "https://{region}.ml.cloud.ibm.com",
    api_key = "{apikey}",
)

client = APIClient(credentials)