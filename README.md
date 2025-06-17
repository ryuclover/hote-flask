Event Management Platform
Aplicação web completa feita com Flask para gerenciamento de eventos. Permite criar, editar, excluir e participar de eventos, com autenticação de usuários e interface moderna.

Funcionalidades
Autenticação de usuários (registro, login, edição de perfil, alteração de senha)

CRUD completo de eventos

Sistema de convites com código único para participação

Dashboard com visão geral dos eventos criados e participações

Tema escuro com layout responsivo

Páginas institucionais: Serviços, Sobre e Contato

Tecnologias Utilizadas
Backend: Flask (Python)

Banco de dados: SQLite com SQLAlchemy ORM

Frontend: HTML5, CSS3, JavaScript

Autenticação: Flask-Login e Werkzeug Security

Ícones: Font Awesome

Instalação
Clone o repositório:

bash
Copiar
Editar
git clone <repository-url>
cd event-management-platform
Instale as dependências:

bash
Copiar
Editar
pip install -r requirements.txt
Configure os arquivos settings.toml e .secrets.toml com as variáveis necessárias.

Execute o app:

bash
Copiar
Editar
python app.py
Acesse http://127.0.0.1:5000 no navegador.
