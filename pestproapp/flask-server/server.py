from flask import Flask, request, jsonify
from flask_cors import CORS
from ibm_watsonx_ai import APIClient
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
import os
import wget
from langchain.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import Chroma
from ibm_watsonx_ai.foundation_models.utils import get_embedding_model_specs
from langchain_ibm import WatsonxEmbeddings, WatsonxLLM
from ibm_watsonx_ai.foundation_models.utils.enums import EmbeddingTypes, ModelTypes
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
from ibm_watsonx_ai.foundation_models.utils.enums import DecodingMethods
from langchain.chains import RetrievalQA
import config

app = Flask(__name__)
CORS(app)

# Preload model and embeddings on startup
credentials = {
    "url": "https://us-south.ml.cloud.ibm.com",
    "apikey": config.api_key
}
project_id = "bb7c35d4-480d-423b-b8a5-7ff43377fe6d"

# Download and prepare the document
filename = 'CropPestInfo.txt'
url = 'https://raw.githubusercontent.com/amanks5/website_AmanShaan/refs/heads/main/Rag4TESTTT.txt'
if not os.path.isfile(filename):
    wget.download(url, out=filename)

# Load document and split text
loader = TextLoader(filename)
documents = loader.load()
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
texts = text_splitter.split_documents(documents)

# Initialize Watsonx embeddings and language model on startup
get_embedding_model_specs(credentials.get('url'))
embeddings = WatsonxEmbeddings(
    model_id=EmbeddingTypes.IBM_SLATE_30M_ENG.value,
    url=credentials["url"],
    apikey=credentials["apikey"],
    project_id=project_id
)
docsearch = Chroma.from_documents(texts, embeddings)

# Initialize language model
model_id = ModelTypes.GRANITE_13B_INSTRUCT_V2
parameters = {
    GenParams.DECODING_METHOD: DecodingMethods.GREEDY,
    GenParams.MIN_NEW_TOKENS: 1,
    GenParams.MAX_NEW_TOKENS: 150,
    GenParams.STOP_SEQUENCES: ["<|endoftext|>"]
}

watsonx_granite = WatsonxLLM(
    model_id=model_id.value,
    url=credentials.get("url"),
    apikey=credentials.get("apikey"),
    project_id=project_id,
    params=parameters
)

# Create QA chain
qa = RetrievalQA.from_chain_type(
    llm=watsonx_granite,
    chain_type="stuff",
    retriever=docsearch.as_retriever()
)

@app.route("/members")
def members(): 
    return {"members": ["Member1", "Member2", "Member3"]}

# Route to get AI response for pest problems
@app.route("/query_pest_info", methods=["POST"])
def query_pest_info():
    # Check if the request contains JSON data
    if not request.is_json:
        return jsonify({"error": "Invalid content type. Expected application/json"}), 415

    # Retrieve county and state from the request JSON
    data = request.get_json()
    county = data.get("county")
    state = data.get("state")

    print(f"Received county: {county}, state: {state}")

    # Verify that both county and state are provided
    if not county or not state:
        return jsonify({"error": "Both county and state parameters are required"}), 400

    # Format the query string
    query = f"Based on the fruit grown in {county} County in {state}, what would be types of pests and the effects on respective plant or crop life?"


    # Run the query using the QA chain
    response = qa.invoke(query)


    print(f"Model response for query '{query}': {response}")


    # Return the response as JSON
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)




