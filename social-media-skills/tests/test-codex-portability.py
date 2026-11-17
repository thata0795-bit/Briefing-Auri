#!/usr/bin/env python3
"""Roda a rota de cópia do README em um HOME isolado; confere os contratos estáticos das skills.

Não é um teste de descoberta pelo assistente, de provedor, de qualidade de escrita nem de aceitação visual.
"""
from pathlib import Path
import os
import json
import select
import sys
import time
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
readme = (ROOT / 'README.md').read_text()
block = readme.split('<!-- CODEX-COPY:START -->')[1].split('<!-- CODEX-COPY:END -->')[0]
command = re.search(r'```bash\n(.*?)\n```', block, re.S).group(1)
skills = sorted((ROOT / 'skills').glob('*/SKILL.md'))
assert len(skills) == 17

with tempfile.TemporaryDirectory(prefix='public-skills-') as temporary:
    project = Path(temporary) / 'client project'
    project.mkdir()
    home = Path(temporary) / 'empty-home'
    home.mkdir()
    source = project / 'social-media-skills' / 'skills'
    shutil.copytree(ROOT / 'skills', source)
    env = {'HOME': str(home), 'PATH': '/usr/bin:/bin', 'LC_ALL': 'C'}

    def install(check=True):
        return subprocess.run(['/bin/bash', '-c', command], cwd=project,
                              env=env, capture_output=True, text=True, check=check)

    install()
    installed = project / '.agents' / 'skills'
    assert len(list(installed.glob('*/SKILL.md'))) == 17
    for original in (ROOT / 'skills').rglob('*'):
        if original.is_file():
            assert (installed / original.relative_to(ROOT / 'skills')).read_bytes() == original.read_bytes()
    assert not list(home.iterdir()), 'The copy route must not write global configuration'

    if '--codex' in sys.argv:
        binary = shutil.which('codex')
        assert binary, '--codex requires the installed Codex CLI'
        runtime_home = home / '.codex'
        runtime_home.mkdir()
        runtime_env = dict(env, CODEX_HOME=str(runtime_home))
        node = shutil.which('node')
        if node:
            runtime_env['PATH'] = str(Path(node).parent) + ':' + env['PATH']
        server = subprocess.Popen([binary, 'app-server', '--stdio'], cwd=project,
                                  env=runtime_env, stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        try:
            def request(message, response_id=None):
                server.stdin.write((json.dumps(message) + '\n').encode())
                server.stdin.flush()
                if response_id is None:
                    return
                buffer = b''
                deadline = time.monotonic() + 30
                while time.monotonic() < deadline:
                    if not select.select([server.stdout], [], [], 1)[0]:
                        continue
                    chunk = os.read(server.stdout.fileno(), 65536)
                    assert chunk, 'Codex app-server exited before responding'
                    buffer += chunk
                    while b'\n' in buffer:
                        line, buffer = buffer.split(b'\n', 1)
                        response = json.loads(line)
                        if response.get('id') == response_id:
                            assert 'error' not in response, response
                            return response['result']
                raise AssertionError('Codex app-server response timed out')
            request({'id': 1, 'method': 'initialize', 'params': {
                'clientInfo': {'name': 'public_skills_check', 'version': '1.0'}}}, 1)
            request({'method': 'initialized', 'params': {}})
            result = request({'id': 2, 'method': 'skills/list', 'params': {
                'cwds': [str(project)], 'forceReload': True}}, 2)
            entry = result['data'][0]
            assert not entry['errors'], entry['errors']
            repo_skills = [item for item in entry['skills'] if item['scope'] == 'repo']
            assert {item['name'] for item in repo_skills} == {item.parent.name for item in skills}
            assert all(Path(item['path']).resolve().parent.parent == installed.resolve() for item in repo_skills)
            assert all(item['scope'] in ('repo', 'system') for item in entry['skills'])
            assert all(str(Path(item['path']).resolve()).startswith(str(Path(temporary).resolve()) + os.sep)
                       for item in entry['skills']), 'Inherited skills outside isolated project/HOME'
            print('OK: descoberta ao vivo pelo Codex das 17 skills do projeto; HOME sem conta nem configuração; nenhuma skill herdada do usuário')
        finally:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()

    # Consecutive source updates preserve customised copies, unrelated files and links.
    voice = installed / 'voice-builder' / 'SKILL.md'
    voice.write_text('CLIENT VOICE CUSTOMISATION\n')
    (source / 'voice-builder' / 'SKILL.md').write_text('UPSTREAM RELEASE TWO\n')
    unrelated = installed / 'client-only'
    unrelated.mkdir()
    (unrelated / 'SKILL.md').write_text('CLIENT SKILL\n')
    shutil.rmtree(installed / 'post-writer')
    (installed / 'post-writer').symlink_to(project / 'missing-custom-source', target_is_directory=True)
    second = install()
    assert voice.read_text() == 'CLIENT VOICE CUSTOMISATION\n'
    assert (unrelated / 'SKILL.md').read_text() == 'CLIENT SKILL\n'
    assert (installed / 'post-writer').is_symlink()
    assert not (project / 'missing-custom-source').exists()
    assert 'Skill existente preservada:' in second.stdout
    (source / 'voice-builder' / 'SKILL.md').write_text('UPSTREAM RELEASE THREE\n')
    install()
    assert voice.read_text() == 'CLIENT VOICE CUSTOMISATION\n'
    shutil.rmtree(source)
    missing = install(check=False)
    assert missing.returncode != 0 and 'Pasta de skills de origem ausente' in missing.stdout

for path in skills:
    text = path.read_text()
    assert '## Execução no Codex e no Claude' in text, path
    assert 'ou pergunte no chat' in text, path
    assert 'valores iniciais de exemplo' in text and 'Não grave aprendizados persistentes sem pedido' in text, path
    assert 'atualização de perfil' in text and 'preservando fatos e regras não relacionados' in text, path
    assert 'Quem consome esses arquivos deve relê-los' in text, path
    assert 'entregas novas que colidiriam com arquivos existentes não relacionados' in text, path
    assert '~/Desktop/' not in text and '/Users/' not in text, path
    for ref in re.findall(r'`(references/[^`]+\.md)`', text):
        assert (path.parent / ref).is_file(), (path, ref)

for name in ['gemini-carousel', 'gemini-infographic', 'graphic-designer', 'pinned-comment',
             'profile-optimizer', 'quote-post', 'youtube-thumbnail']:
    text = (ROOT / 'skills' / name / 'SKILL.md').read_text()
    assert '**prontos para uso como prompt**' in text and 'inspecione cada exportação' in text, name
for name in ['niche-research', 'post-scorer', 'reels-scripting']:
    text = (ROOT / 'skills' / name / 'SKILL.md').read_text()
    assert 'Nunca colete comentários' in text, name
scorer = (ROOT / 'skills/post-scorer/SKILL.md').read_text()
assert 'Fallback benchmarks' not in scorer and 'Charlie Hills data' not in scorer
assert 'renderização pendente' in (ROOT / 'skills/graphic-designer/SKILL.md').read_text()
print('OK: 17 cópias locais e referências incluídas; HOME limpo; preservação em cópias consecutivas; falha com origem ausente; contratos de instrução portáveis')
print('NÃO TESTADO: acesso a provedores, qualidade do conteúdo gerado, aceitação visual, ativação no cliente')
if '--codex' not in sys.argv:
    print('NÃO TESTADO: descoberta ao vivo pelo assistente (rode com --codex no macOS/Linux)')
